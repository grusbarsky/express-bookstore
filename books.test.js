process.env.NODE_ENV = "test"

const request = require("supertest");
const app = require("../app");
const db = require("../db");


let book_isbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO 
      books (isbn, amazon_url,author,language,pages,publisher,title,year)   
      VALUES(
        '123', 
        'https://amazon.com/test', 
        'Poe', 
        'English', 
        123,  
        'Test Publisher', 
        'A Test Book', 2021) 
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
  });
  
  
  afterAll(async function () {
    await db.end()
  });


describe("POST /books", async function () {
  test("Creates a new book", async function () {
    const response = await request(app)
        .post(`/books`)
        .send({
          isbn: '111',
          amazon_url: "https://amazon.com",
          author: "Testing",
          language: "english",
          pages: 1000,
          publisher: "Test Publisher",
          title: "New Book",
          year: 2015
        });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });
});


describe("GET /books", async function () {
  test("Gets list of all books", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
  });
});


describe("GET /books/:isbn", async function () {
  test("Gets a single book", async function () {
    const response = await request(app)
        .get(`/books/${book_isbn}`)
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test("Responds with 404 if book can't be found", async function () {
    const response = await request(app)
        .get(`/books/1111`)
    expect(response.statusCode).toBe(404);
  });
});


describe("PUT /books/:id", async function () {
  test("Updates a book", async function () {
    const response = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
          amazon_url: "https://amazon.com",
          author: "New Author",
          language: "english",
          pages: 1000,
          publisher: "New Publisher",
          title: "New Title",
          year: 2021
        });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.url).toBe("https://amazon.com");
    expect(response.body.book.author).toBe("New Author");
    expect(response.body.book.publisher).toBe("New Publisher");
    expect(response.body.book.title).toBe("UPDATED BOOK");
  });

  test("Responds 404 if book does not exist", async function () {
    await request(app)
        .delete(`/books/${book_isbn}`)
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(404);
  });
});


describe("DELETE /books/:id", function () {
  test("Deletes a book", async function () {
    const response = await request(app)
        .delete(`/books/${book_isbn}`)
    expect(response.body).toEqual({message: "Book deleted"});
  });
});
